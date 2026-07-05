---
read_when:
    - 您想要根據編寫好的 policy.jsonc 檢查 OpenClaw 設定
    - 你希望在 doctor lint 中取得政策發現
    - 你需要一個用於稽核證據的政策證明雜湊
summary: '`openclaw policy` 符合性檢查的命令列介面參考'
title: 政策
x-i18n:
    generated_at: "2026-07-05T11:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dcfb534a6abbfbf8c05e50a6cc81403410c74dc2d557db5c1cab299da3f7ca4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` 由內建的 Policy 外掛提供。它是在既有 OpenClaw 設定之上的企業
合規層，不是第二套組態
系統。你在 `policy.jsonc` 中撰寫要求；OpenClaw 會觀察作用中的
工作區作為證據；政策會透過 `doctor --lint` 回報偏移。Policy
不會在請求時強制執行工具呼叫或改寫執行階段行為，也
不會證明每個代理的憑證存放區，例如 `auth-profiles.json`。

政策會檢查已設定的通道、MCP 伺服器、模型供應商、網路 SSRF
狀態、入口/通道存取、閘道暴露與節點命令狀態、
代理工作區存取、沙箱狀態、資料處理狀態、祕密
供應商/驗證設定檔狀態，以及受治理的工具中繼資料 (`TOOLS.md`)。當
工作區需要一份持久、可檢查的聲明時使用它，例如「Telegram 必須
未啟用」或「受治理的工具必須宣告風險與擁有者中繼資料」。如果
你只需要本機行為，且不需要證明或偏移偵測，單純
組態就足夠。

## 快速開始

```bash
openclaw plugins enable policy
```

即使缺少 `policy.jsonc`，外掛仍會保持啟用，因此 doctor 可以
回報缺少的成品，而不是默默略過檢查。

請手動撰寫 `policy.jsonc`；它不是從目前設定產生。每個
頂層區段都是規則命名空間：只有在其下存在具體規則時，
檢查才會執行（不支援的區段或鍵會以
`policy/policy-jsonc-invalid` 失敗，而不是被默默忽略）。涵蓋
所有支援區段的最小範例：

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
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

以下是從下方規則表不容易看出的跨領域注意事項：

- 在拒絕非 loopback 繫結時省略 `gateway.bind`，代表你接受
  執行階段預設值；若要嚴格合規，請設定 `gateway.bind: "loopback"`。
- 對於唯讀代理，請在適用的預設值/代理上將沙箱 `mode` 設為 `all` 或 `non-main`，
  並將 `workspaceAccess` 設為 `none` 或 `ro`。缺少沙箱模式或
  `off` 沙箱模式不符合唯讀政策。
- `agents.workspace.denyTools` 接受 `exec`、`process`、`write`、`edit`、
  `apply_patch`。組態工具拒絕群組 `group:fs`（檔案變更）與
  `group:runtime`（shell/程序）符合等效狀態。
- 只有在存在 `execApprovals` 規則時，執行核准檢查才會讀取即時的
  `exec-approvals.json` 成品；缺少或無效的成品是
  無法觀察的證據，不是合成通過。
- 祕密與驗證設定檔證據只記錄供應商/來源狀態與
  SecretRef 中繼資料，絕不記錄原始值。Policy 不會讀取或證明
  每個代理的憑證存放區，例如 `auth-profiles.json`。
- 資料處理證據只是不涉及內容的組態層級狀態（遮蔽模式、
  遙測擷取切換、工作階段維護模式、逐字稿索引
  設定）。它不會檢查記錄、遙測匯出、逐字稿或
  記憶檔案，而且乾淨的結果不代表其中沒有個人資料或
  祕密。

### 政策規則參考

以下每項規則都是選用；只有在規則存在時，檢查才會執行。觀察到的
狀態是既有的 OpenClaw 組態或工作區中繼資料。

#### 作用域覆蓋

當特定代理或通道需要比頂層基準更嚴格的政策時，使用
`scopes.<scopeName>`。作用域名稱只是標籤；比對會使用作用域內的
選擇器。覆蓋是加成的：全域規則仍會執行，
作用域規則可以針對相同證據加入自己的發現。

| 選擇器       | 支援的區段                                                                     | 使用時機                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | 一個或多個執行階段代理需要更嚴格的規則。          |
| `channelIds` | `ingress.channels`                                                             | 一個或多個通道需要更嚴格的入口規則。              |

如果 `agentIds` 項目不存在於 `agents.list[]`，OpenClaw 會
針對該執行階段代理 ID 繼承的全域/預設狀態評估
作用域規則，而不是略過它。

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

如上所示，如果每個作用域治理不同欄位，同一個代理可以出現在多個
作用域中。同一代理的重複作用域欄位必須同等或
更嚴格；較弱的重複宣告會被拒絕（允許清單是
子集，拒絕清單是超集，必要布林值是固定值）。

容器狀態規則 (`sandbox.containers.*`) 只會對照
相符代理的沙箱後端可暴露的證據來檢查。如果後端無法
觀察你為它啟用的規則，政策會回報
`policy/sandbox-container-posture-unobservable` 而不是通過；請將作用域
容器規則限制在使用可暴露這些證據的後端的代理群組。

頂層 `ingress.session.requireDmScope` 維持全域；`session.dmScope` 不是
可歸因到通道的證據，因此無法由 `channelIds` 設定作用域。

`policy.jsonc` 中存在的每個作用域都必須有效且可強制執行。

#### 通道

| 政策欄位                             | 觀察到的狀態                          | 使用時機                                                     |
| ------------------------------------ | ------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` 供應商和啟用狀態         | 拒絕來自某個供應商的已設定通道，例如 `telegram`。            |
| `channels.denyRules[].reason`        | 發現訊息與修復提示脈絡                | 說明為什麼該供應商被拒絕。                                  |

#### MCP 伺服器

| 政策欄位            | 觀察到的狀態      | 使用時機                                                   |
| ------------------- | ----------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ID | 要求每個已設定的 MCP 伺服器都在允許清單中。                |
| `mcp.servers.deny`  | `mcp.servers.*` ID | 拒絕特定已設定的 MCP 伺服器 ID。                           |

#### 模型供應商

| 政策欄位                 | 觀察到的狀態                                   | 使用時機                                                                        |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID 與選定模型參照         | 要求已設定的供應商與選定模型參照使用核准的供應商。                              |
| `models.providers.deny`  | `models.providers.*` ID 與選定模型參照         | 依供應商 ID 拒絕已設定的供應商與選定模型參照。                                  |

#### 網路

| 政策欄位                       | 觀察到的狀態                      | 使用時機                                                           |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | 私有網路 SSRF 逃逸通道            | 設為 `false` 以要求私有網路存取保持停用。                          |

#### 入口與通道存取

| 政策欄位                                  | 觀察到的狀態                                                 | 使用時機                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 要求經審查的私訊隔離範圍。                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 和舊版頻道 DM 政策欄位      | 僅允許經審查的私訊頻道政策。               |
| `ingress.channels.denyOpenGroups`         | 頻道、帳號與群組入口政策                     | 拒絕已設定頻道與帳號的開放群組入口。      |
| `ingress.channels.requireMentionInGroups` | 頻道、帳號、群組、guild 與巢狀提及門檻設定 | 當群組入口開放或受提及門檻控管時，要求提及門檻。 |

#### 閘道

| 政策欄位                            | 觀察到的狀態                                 | 使用時機                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | 設為 `false` 以要求閘道繫結至 loopback。                                  |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel 閘道狀態         | 設為 `false` 以拒絕 Tailscale Funnel 暴露。                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 設為 `true` 以拒絕停用閘道驗證。                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 設為 `true` 以要求明確的驗證速率限制設定。                            |
| `gateway.controlUi.allowInsecure`       | Control UI 不安全驗證/裝置/來源切換 | 設為 `false` 以拒絕不安全的 Control UI 暴露切換。                         |
| `gateway.remote.allow`                  | 遠端閘道模式/設定                     | 設為 `false` 以拒絕遠端閘道模式。                                          |
| `gateway.http.denyEndpoints`            | 閘道 HTTP API 端點                     | 拒絕端點 ID，例如 `chatCompletions` 或 `responses`。                          |
| `gateway.http.requireUrlAllowlists`     | 閘道 HTTP URL 擷取輸入                  | 設為 `true` 以要求 URL 擷取輸入使用 URL 允許清單。                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | 要求在 OpenClaw 設定中拒絕確切的節點命令 ID，例如 `system.run`。 |

`gateway.nodes.denyCommands` 是確切且區分大小寫的拒絕超集合規則。
當政策必須證明特權節點命令已由 OpenClaw 設定明確
拒絕時使用。若部署刻意允許某個特權
節點命令，應在審查後更新 `policy.jsonc`，而不是只依賴
`gateway.nodes.allowCommands`。

#### 代理工作區

| 政策欄位                     | 觀察到的狀態                                                                        | 使用時機                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 和 `agents.list[].sandbox.workspaceAccess` | 僅允許沙箱工作區存取值，例如 `none` 或 `ro`。                       |
| `agents.workspace.denyTools`     | 全域與各代理工具拒絕設定                                                 | 要求拒絕變更工具（`exec`、`process`、`write`、`edit`、`apply_patch`）。 |

#### 沙箱狀態

| 政策欄位                                          | 觀察到的狀態                                          | 使用時機                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 和各代理模式       | 僅允許經審查的沙箱模式，例如 `all` 或 `non-main`。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 和各代理後端 | 僅允許經審查的沙箱後端，例如 `docker`。         |
| `sandbox.containers.denyHostNetwork`                  | 容器支援的沙箱/瀏覽器網路模式           | 拒絕主機網路模式。                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | 容器支援的沙箱/瀏覽器網路模式           | 拒絕加入另一個容器網路命名空間。              |
| `sandbox.containers.requireReadOnlyMounts`            | 容器支援的沙箱/瀏覽器掛載模式             | 要求掛載為唯讀。                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 容器支援的沙箱/瀏覽器掛載目標          | 拒絕容器執行階段 socket 掛載。                          |
| `sandbox.containers.denyUnconfinedProfiles`           | 容器安全設定檔狀態                      | 拒絕未受限制的容器安全設定檔。                   |
| `sandbox.browser.requireCdpSourceRange`               | 沙箱瀏覽器 CDP 來源範圍                        | 要求瀏覽器 CDP 暴露宣告來源範圍。        |

政策會將缺少的 `sandbox.mode` 視為其隱含預設值 `off`，因此
`sandbox.requireMode` 會將全新或未設定的沙箱回報為不在
允許清單之外，例如 `["all"]`。

#### 資料處理

| 政策欄位                                        | 觀察到的狀態                                                                       | 使用時機                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | 設為 `true` 以拒絕 `logging.redactSensitive: "off"`。              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | 設為 `true` 以拒絕遙測內容擷取。                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 設為 `true` 以要求有效的工作階段維護模式 `enforce`。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 和 `agents.*.memorySearch.experimental.sessionMemory` | 設為 `true` 以拒絕將工作階段逐字稿索引到記憶體。       |

#### 密鑰

| 政策欄位                      | 觀察到的狀態                                           | 使用時機                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 設定 SecretRefs 和 `secrets.providers.*` 宣告 | 設為 `true` 以要求 SecretRefs 指向已宣告的提供者。     |
| `secrets.denySources`             | 密鑰提供者來源和 SecretRef 來源            | 拒絕來源，例如 `exec`、`file` 或另一個已設定的來源名稱。 |
| `secrets.allowInsecureProviders`  | 不安全密鑰提供者狀態旗標                   | 設為 `false` 以拒絕選擇加入不安全狀態的提供者。      |

#### Exec 核准

Exec 核准檢查會讀取執行階段 `exec-approvals.json` 成品：
預設為 `~/.openclaw/exec-approvals.json`，或在設定
`OPENCLAW_STATE_DIR` 時使用 `$OPENCLAW_STATE_DIR/exec-approvals.json`。
`execApprovals.defaults.*` 或 `execApprovals.agents.*` 下的狀態規則
要求可讀取的成品證據；缺少或無效的成品會回報為
不可觀察的證據，而不是盡力通過。可讀取後，省略的
欄位會繼承執行階段預設值：缺少的 `defaults.security` 為 `full`，且
缺少的代理安全性會繼承該預設值。證據包含 `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、可選的 `argPattern`、有效的
`autoAllowSkills` 狀態，以及項目來源，不包含 socket path/token、
`commandText`、`lastUsedCommand`、已解析路徑或時間戳記。

| 政策欄位                                | 觀察到的狀態                                                                         | 使用時機                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 作用中的執行階段 `exec-approvals.json` 路徑                                              | 設為 `true` 以要求核准成品存在且可解析。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`，預設為 `full`                                              | 僅允許已核准的預設核准安全模式。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`，繼承預設值                                               | 僅允許已核准的各代理有效核准安全模式。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 和 `agents.*.autoAllowSkills`，繼承執行階段預設值 | 設為 `false` 以要求嚴格的手動允許清單，不使用隱含的 skill 命令列介面核准。 |
| `execApprovals.agents.allowlist.expected`   | 彙總的 `agents.*.allowlist[]` 模式和可選 argPattern 項目               | 要求核准允許清單符合經審查的模式集合。                      |

範例：要求核准成品、拒絕寬鬆的預設值，並僅允許
所選代理使用經審查的 exec 核准狀態。

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

| 政策欄位                    | 觀察到的狀態                               | 使用時機                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` 提供者與模式中繼資料 | 要求設定驗證設定檔包含中繼資料鍵，例如 `provider` 與 `mode`。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | 只允許支援的驗證設定檔模式，例如 `api_key`、`aws-sdk`、`oauth` 或 `token`。 |

#### 工具中繼資料

| 政策欄位            | 觀察到的狀態                   | 使用時機                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 受治理的 `TOOLS.md` 宣告 | 要求受治理的工具宣告中繼資料鍵，例如 `risk`、`sensitivity` 或 `owner`。 |

#### 工具姿態

| 政策欄位                    | 觀察到的狀態                                              | 使用時機                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 與 `agents.list[].tools.profile`           | 只允許工具設定檔 ID，例如 `minimal`、`messaging` 或 `coding`。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 與各代理程式的 `tools.fs` 覆寫 | 設為 `true`，以要求僅限工作區的檔案系統工具姿態。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` 與各代理程式的執行安全性           | 只允許執行安全模式，例如 `deny` 或 `allowlist`。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` 與各代理程式的執行詢問模式                | 要求核准姿態，例如 `always`。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` 與各代理程式的執行主機路由           | 只允許執行主機路由模式，例如 `sandbox`。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` 與各代理程式的提升權限姿態     | 設為 `false`，以要求提升權限工具模式保持停用。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 與各代理程式的 `tools.alsoAllow`           | 要求精確的 `alsoAllow` 項目，並回報缺少或非預期的新增工具授權。                 |
| `tools.denyTools`               | `tools.deny` 與 `agents.list[].tools.deny`                 | 要求已設定的工具拒絕清單包含工具 ID 或群組，例如 `group:runtime` 與 `group:fs`。 |

## 執行檢查

在編寫期間執行僅限政策的檢查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 只執行政策檢查集，並輸出證據、發現項目
與證明雜湊。啟用 Policy 外掛時，相同的發現項目也會出現在
`openclaw doctor --lint` 中。

將運維人員政策檔案與編寫的基準進行比較：

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` 會以政策檔案語法檢查政策檔案語法；它不會
檢查執行階段狀態、證據、憑證或秘密。它使用與範圍覆寫相同的
規則中繼資料：允許清單必須維持相同或更窄，
拒絕清單必須維持相同或更廣，必要布林值必須保留
其值，已排序字串只能朝設定順序中更嚴格的一端移動，
而精確清單必須相符。基準可以是
組織編寫的政策；受檢查的政策可以加入更嚴格的值或
額外規則。當頂層受檢查規則同等或更嚴格時，
可以滿足範圍基準規則。檔案之間的範圍名稱不需要相符；
比較會依選擇器（`agentIds`/`channelIds`）與欄位建立索引。

乾淨的比較（`--json`）：

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

乾淨的 `policy check --json` 輸出包含運維人員或
監督器可記錄的穩定雜湊：

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

政策設定位於 `plugins.entries.policy.config` 下。

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
| `enabled`                 | 即使 `policy.jsonc` 尚不存在，也啟用政策檢查。         |
| `workspaceRepairs`        | 允許 `doctor --fix` 編輯由政策管理的工作區設定。 |
| `expectedHash`            | 已核准政策成品的選用雜湊鎖定。            |
| `expectedAttestationHash` | 上次接受的乾淨政策檢查的選用雜湊鎖定。    |
| `path`                    | 政策成品相對於工作區的位置。             |

將 `plugins.entries.policy.config.enabled` 設為 `false`，可在工作區停用政策
檢查，同時保留外掛安裝。

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

`attestation.policy.hash` 可識別編寫的規則成品。`evidence`
會記錄檢查所使用的已觀察 OpenClaw 狀態，而
`workspace.hash` 可識別該證據承載資料。`findingsHash` 可識別
精確的發現項目集合。`checkedAt` 會記錄檢查執行的時間。
`attestationHash` 可識別穩定宣告（政策雜湊、證據雜湊、
發現項目雜湊，以及乾淨/髒污狀態），並刻意排除 `checkedAt`，
因此相同的政策狀態一律會產生相同的證明雜湊。這四個值合在一起
形成一次政策檢查的稽核元組。

如果閘道或監督器使用政策來封鎖、核准或註解
執行階段動作，應記錄上一次乾淨檢查的證明雜湊。
`checkedAt` 會保留在 JSON 輸出中以供稽核日誌使用，但不屬於
穩定雜湊的一部分。

接受政策狀態的生命週期：

1. 編寫或審查 `policy.jsonc`。
2. 執行 `openclaw policy check --json`。
3. 如果乾淨，將 `attestation.policy.hash` 記錄為 `expectedHash`。
4. 將 `attestation.attestationHash` 記錄為 `expectedAttestationHash`。
5. 在 CI 或發行閘門中重新執行 `openclaw doctor --lint`。

如果政策規則是刻意變更，請從乾淨的檢查結果更新兩個已接受的雜湊。如果只有工作區設定變更（政策維持不變），通常只會變更 `expectedAttestationHash`。

啟用或升級 `agents.workspace` 規則會將 `agentWorkspace` 證據加入工作區雜湊與證明雜湊；啟用後請審查新的證據，並重新整理已接受的證明雜湊。啟用或升級工具態勢規則也會以相同方式加入 `toolPosture` 證據。

`openclaw policy watch` 會重新執行檢查，並在目前證據不再符合 `expectedAttestationHash` 時回報：

```bash
openclaw policy watch --json
```

在 CI 或需要單次漂移評估的指令碼中使用 `--once`。若未使用 `--once`，預設每兩秒輪詢一次；使用 `--interval-ms` 可變更間隔。

## 發現項目

| 檢查 id                                                  | 發現項目                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 政策已啟用，但缺少 `policy.jsonc`。                                               |
| `policy/policy-jsonc-invalid`                            | 政策無法剖析，或包含格式錯誤的規則項目。                                          |
| `policy/policy-hash-mismatch`                            | 政策不符合已設定的 `expectedHash`。                                               |
| `policy/attestation-hash-mismatch`                       | 目前政策證據不再符合已接受的證明。                                                |
| `policy/policy-conformance-invalid`                      | 基準或已檢查的政策檔案包含無效的比較語法。                                        |
| `policy/policy-conformance-missing`                      | 已檢查的政策檔案缺少基準政策檔案要求的規則。                                      |
| `policy/policy-conformance-weaker`                       | 已檢查的政策檔案值比基準政策檔案更弱。                                            |
| `policy/channels-denied-provider`                        | 已啟用的通道符合通道拒絕規則。                                                    |
| `policy/mcp-denied-server`                               | 已設定的 MCP 伺服器遭政策拒絕。                                                   |
| `policy/mcp-unapproved-server`                           | 已設定的 MCP 伺服器不在允許清單內。                                               |
| `policy/models-denied-provider`                          | 已設定的模型提供者或模型參照使用遭拒絕的提供者。                                  |
| `policy/models-unapproved-provider`                      | 已設定的模型提供者或模型參照不在允許清單內。                                      |
| `policy/network-private-access-enabled`                  | 政策拒絕時，私人網路 SSRF 逃生口仍已啟用。                                        |
| `policy/ingress-dm-policy-unapproved`                    | 通道 DM 政策不在政策允許清單內。                                                  |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` 不符合政策要求的 DM 隔離範圍。                                  |
| `policy/ingress-open-groups-denied`                      | 政策拒絕開放群組輸入時，通道群組政策仍為 `open`。                                 |
| `policy/ingress-group-mention-required`                  | 政策要求提及閘門時，通道或群組項目停用了提及閘門。                                |
| `policy/gateway-non-loopback-bind`                       | 政策拒絕時，閘道繫結態勢允許非 loopback 暴露。                                    |
| `policy/gateway-auth-disabled`                           | 政策要求驗證時，閘道驗證已停用。                                                  |
| `policy/gateway-rate-limit-missing`                      | 政策要求時，閘道驗證速率限制態勢未明確設定。                                      |
| `policy/gateway-control-ui-insecure`                     | 閘道 Control UI 的不安全暴露切換已啟用。                                          |
| `policy/gateway-tailscale-funnel`                        | 政策拒絕時，閘道 Tailscale Funnel 暴露仍已啟用。                                  |
| `policy/gateway-remote-enabled`                          | 政策拒絕時，閘道遠端模式仍處於作用中。                                            |
| `policy/gateway-http-endpoint-enabled`                   | 政策拒絕時，閘道 HTTP API 端點仍已啟用。                                          |
| `policy/gateway-http-url-fetch-unrestricted`             | 閘道 HTTP URL 擷取輸入缺少必要的 URL 允許清單。                                    |
| `policy/gateway-node-command-denied`                     | 政策拒絕的節點命令未被 OpenClaw 設定拒絕。                                        |
| `policy/agents-workspace-access-denied`                  | Agent 沙盒模式或工作區存取不在政策允許清單內。                                    |
| `policy/agents-tool-not-denied`                          | Agent 或預設設定未拒絕政策要求拒絕的工具。                                        |
| `policy/tools-profile-unapproved`                        | 已設定的全域或個別 Agent 工具設定檔不在允許清單內。                               |
| `policy/tools-fs-workspace-only-required`                | 檔案系統工具未設定為僅限工作區路徑態勢。                                          |
| `policy/tools-exec-security-unapproved`                  | Exec 安全模式不在政策允許清單內。                                                 |
| `policy/tools-exec-ask-unapproved`                       | Exec 詢問模式不在政策允許清單內。                                                 |
| `policy/tools-exec-host-unapproved`                      | Exec 主機路由不在政策允許清單內。                                                 |
| `policy/tools-elevated-enabled`                          | 政策拒絕時，提升權限工具模式仍已啟用。                                            |
| `policy/tools-also-allow-missing`                        | 已設定的 `alsoAllow` 清單缺少政策要求的項目。                                     |
| `policy/tools-also-allow-unexpected`                     | 已設定的 `alsoAllow` 清單包含政策未預期的項目。                                   |
| `policy/tools-required-deny-missing`                     | 全域或個別 Agent 工具拒絕清單未包含必要的遭拒工具。                               |
| `policy/sandbox-mode-unapproved`                         | 沙盒模式不在政策允許清單內。                                                      |
| `policy/sandbox-backend-unapproved`                      | 沙盒後端不在政策允許清單內。                                                      |
| `policy/sandbox-container-posture-unobservable`          | 容器態勢規則已對無法觀察該規則的後端啟用。                                        |
| `policy/sandbox-container-host-network-denied`           | 容器支援的沙盒或瀏覽器使用主機網路模式。                                          |
| `policy/sandbox-container-namespace-join-denied`         | 容器支援的沙盒或瀏覽器加入另一個容器命名空間。                                    |
| `policy/sandbox-container-mount-mode-required`           | 容器支援的沙盒或瀏覽器掛載不是唯讀。                                              |
| `policy/sandbox-container-runtime-socket-mount`          | 容器支援的沙盒或瀏覽器掛載暴露容器執行階段 socket。                               |
| `policy/sandbox-container-unconfined-profile`            | 政策拒絕時，容器沙盒設定檔未受限制。                                              |
| `policy/sandbox-browser-cdp-source-range-missing`        | 政策要求時，沙盒瀏覽器 CDP 來源範圍缺失。                                         |
| `policy/data-handling-redaction-disabled`                | 政策要求時，敏感記錄遮蔽已停用。                                                  |
| `policy/data-handling-telemetry-content-capture`         | 政策拒絕時，遙測內容擷取仍已啟用。                                                |
| `policy/data-handling-session-retention-not-enforced`    | 政策要求時，工作階段保留維護未強制執行。                                          |
| `policy/data-handling-session-transcript-memory-enabled` | 政策拒絕時，工作階段逐字稿記憶索引仍已啟用。                                      |
| `policy/secrets-unmanaged-provider`                      | 設定 SecretRef 參照了未在 `secrets.providers` 下宣告的提供者。                    |
| `policy/secrets-denied-provider-source`                  | 設定密鑰提供者或 SecretRef 使用政策拒絕的來源。                                   |
| `policy/secrets-insecure-provider`                       | 政策拒絕時，密鑰提供者仍選擇使用不安全態勢。                                      |
| `policy/auth-profile-invalid-metadata`                   | 設定驗證設定檔缺少有效的提供者或模式中繼資料。                                    |
| `policy/auth-profile-unapproved-mode`                    | 設定驗證設定檔模式不在政策允許清單內。                                            |
| `policy/exec-approvals-missing`                          | 政策要求 `exec-approvals.json`，但缺少該成品。                                    |
| `policy/exec-approvals-invalid`                          | 已設定的 exec 核准成品無法剖析。                                                  |
| `policy/exec-approvals-default-security-unapproved`      | Exec 核准預設值使用不在政策允許清單內的安全模式。                                 |
| `policy/exec-approvals-agent-security-unapproved`        | 個別 Agent 的有效 exec 核准安全模式不在允許清單內。                               |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 政策拒絕時，exec 核准 Agent 仍隱含自動允許 skill CLI。                            |
| `policy/exec-approvals-allowlist-missing`                | 核准允許清單缺少政策要求的模式。                                                  |
| `policy/exec-approvals-allowlist-unexpected`             | 核准允許清單包含政策未預期的模式。                                                |
| `policy/tools-missing-risk-level`                        | 受治理的工具宣告缺少風險中繼資料。                                                |
| `policy/tools-unknown-risk-level`                        | 受治理的工具宣告使用未知的風險值。                                                |
| `policy/tools-missing-sensitivity-token`                 | 受治理的工具宣告缺少敏感度中繼資料。                                              |
| `policy/tools-missing-owner`                             | 受治理的工具宣告缺少擁有者中繼資料。                                              |
| `policy/tools-unknown-sensitivity-token`                 | 受治理的工具宣告使用未知的敏感度值。                                              |

發現項目可以同時包含 `target`（觀察到不符合的工作區項目）和 `requirement`（使其成為發現項目的已撰寫規則）。兩者目前都是 `oc://` 位址字串，但欄位名稱描述的是政策角色，而不是位址格式。

發現項目範例：

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
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
  "message": "MCP server 'remote' is not in the policy allowlist.",
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
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
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
  "message": "Network setting 'browser-private-network' allows private-network access.",
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
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
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
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## 修復

`doctor --lint` 和 `policy check` 都是唯讀的。

只有在明確啟用 `workspaceRepairs` 時，`doctor --fix` 才會編輯由政策管理的工作區設定；否則檢查只會回報會修復哪些項目，並保持設定不變。

目前，修復可以停用在 OpenClaw 設定中已啟用、但被 `channels.denyRules` 拒絕的頻道。只有在政策檔案已經過審查後，才啟用 `workspaceRepairs`，因為有效的拒絕規則可能會關閉已設定的頻道：

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

| 命令             | `0`                                | `1`                                      | `2`              |
| ---------------- | ---------------------------------- | ---------------------------------------- | ---------------- |
| `policy check`   | 閾值內沒有發現項目。               | 一個或多個發現項目達到閾值。             | 引數或執行階段失敗。 |
| `policy compare` | 政策檔案至少與基準同樣嚴格。       | 政策檔案無效、遺失，或比基準規則更寬鬆。 | 引數或執行階段失敗。 |
| `policy watch`   | 沒有發現項目，且已接受的雜湊為最新。 | 存在發現項目，或已接受的證明已過期。     | 引數或執行階段失敗。 |

## 相關

- [Doctor lint 模式](/zh-TW/cli/doctor#lint-mode)
- [Path 命令列介面](/zh-TW/cli/path)
