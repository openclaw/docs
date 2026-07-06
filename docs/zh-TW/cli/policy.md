---
read_when:
    - 你想要根據撰寫好的 policy.jsonc 檢查 OpenClaw 設定
    - 你希望 doctor lint 產生政策發現
    - 你需要政策聲明雜湊作為稽核證據
summary: '`openclaw policy` 相容性檢查的命令列介面參考'
title: 政策
x-i18n:
    generated_at: "2026-07-06T21:47:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c58284793e9bdda4fa855b34b873d9427d9f64886882b2ad1dc4dc19dededaa
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` 由隨附的 Policy 外掛提供。它是在現有 OpenClaw 設定之上的企業合規層，而不是第二套設定系統。你在 `policy.jsonc` 中撰寫需求；OpenClaw 會觀察作用中的工作區作為證據；policy 透過 `doctor --lint` 回報漂移。Policy 不會在請求時強制執行工具呼叫或改寫執行階段行為，也不會證明每個代理的憑證存放區，例如 `auth-profiles.json`。

Policy 會檢查已設定的通道、MCP 伺服器、模型供應商、網路 SSRF 態勢、入口/通道存取、閘道暴露與節點命令態勢、代理工作區存取、沙箱態勢、資料處理態勢、密鑰供應商/驗證設定檔態勢，以及受治理的工具中繼資料 (`TOOLS.md`)。當工作區需要持久且可檢查的聲明時使用它，例如「Telegram 不得啟用」或「受治理的工具必須宣告風險與擁有者中繼資料」。如果你只需要本機行為，且不需要證明或漂移偵測，單純設定就足夠。

## 快速開始

```bash
openclaw plugins enable policy
```

即使缺少 `policy.jsonc`，外掛也會保持啟用，因此 doctor 可以回報缺少該成品，而不是默默略過檢查。

請手動撰寫 `policy.jsonc`；它不是從目前設定產生的。每個頂層區段都是規則命名空間：只有在其下存在具體規則時，檢查才會執行（不支援的區段或鍵會以 `policy/policy-jsonc-invalid` 失敗，而不是被默默忽略）。涵蓋每個支援區段的最小範例：

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

- 在拒絕非 local loopback 繫結時省略 `gateway.bind`，代表你接受執行階段預設值；若要嚴格合規，請設定 `gateway.bind: "loopback"`。
- 對於唯讀代理，請在適用的預設值/代理上將沙箱 `mode` 設為 `all` 或 `non-main`，並將 `workspaceAccess` 設為 `none` 或 `ro`。缺少沙箱模式或 `off` 沙箱模式不符合唯讀 policy。
- `agents.workspace.denyTools` 接受 `exec`、`process`、`write`、`edit`、`apply_patch`。設定工具拒絕群組 `group:fs`（檔案變更）與 `group:runtime`（shell/程序）可滿足等效態勢。
- 只有在存在 `execApprovals` 規則時，Exec-approvals 檢查才會讀取即時的 `exec-approvals.json` 成品；缺少或無效的成品是無法觀察的證據，不是合成通過。
- 密鑰與驗證設定檔證據只會記錄供應商/來源態勢與 SecretRef 中繼資料，絕不記錄原始值。Policy 不會讀取或證明每個代理的憑證存放區，例如 `auth-profiles.json`。
- 資料處理證據只是設定層級態勢（遮罩模式、遙測擷取切換、工作階段維護模式、逐字稿索引設定）。它不會檢查記錄、遙測匯出、逐字稿或記憶體檔案，且乾淨的結果不代表其中不存在個人資料或密鑰。

### Policy 規則參考

以下每個規則都是選用；只有在規則存在時才會執行檢查。觀察到的狀態是現有 OpenClaw 設定或工作區中繼資料。

#### 範圍化覆蓋

當特定代理或通道需要比頂層基準更嚴格的 policy 時，請使用 `scopes.<scopeName>`。範圍名稱只是一個標籤；比對使用範圍內的選擇器。覆蓋是加成的：全域規則仍會執行，而範圍化規則可以針對同一證據新增自己的發現。

| 選擇器       | 支援的區段                                                                       | 使用時機                         |
| ------------ | -------------------------------------------------------------------------------- | -------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | 一個或多個執行階段代理需要更嚴格的規則。 |
| `channelIds` | `ingress.channels`                                                             | 一個或多個通道需要更嚴格的入口規則。     |

如果 `agentIds` 項目不存在於 `agents.list[]`，OpenClaw 會針對該執行階段代理 ID 以繼承的全域/預設態勢評估範圍化規則，而不是略過它。

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

同一代理可以出現在多個範圍中，只要每個範圍治理不同欄位，如上所示。同一代理的重複範圍化欄位必須同等或更嚴格；較弱的重複聲明會被拒絕（允許清單是子集、拒絕清單是超集、必要布林值是固定值）。

容器態勢規則 (`sandbox.containers.*`) 只會針對相符代理的沙箱後端可暴露的證據進行檢查。如果後端無法觀察你為其啟用的規則，policy 會回報 `policy/sandbox-container-posture-unobservable`，而不是通過；請將容器規則範圍化到使用可暴露它們之後端的代理群組。

頂層 `ingress.session.requireDmScope` 維持全域；`session.dmScope` 不是可歸屬於通道的證據，因此不能透過 `channelIds` 範圍化。

`policy.jsonc` 中存在的每個範圍都必須有效且可強制執行。

#### 通道

| Policy 欄位                         | 觀察到的狀態                          | 使用時機                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` 供應商與啟用狀態 | 拒絕來自供應商的已設定通道，例如 `telegram`。 |
| `channels.denyRules[].reason`        | 發現訊息與修復提示內容 | 說明為何拒絕該供應商。                          |

#### MCP 伺服器

| Policy 欄位        | 觀察到的狀態      | 使用時機                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ID | 要求每個已設定的 MCP 伺服器都在允許清單中。 |
| `mcp.servers.deny`  | `mcp.servers.*` ID | 拒絕特定已設定的 MCP 伺服器 ID。                   |

#### 模型供應商

| Policy 欄位             | 觀察到的狀態                                   | 使用時機                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID 與選取的模型參照 | 要求已設定供應商與選取的模型參照使用核准的供應商。 |
| `models.providers.deny`  | `models.providers.*` ID 與選取的模型參照 | 依供應商 ID 拒絕已設定供應商與選取的模型參照。               |

#### 網路

| Policy 欄位                   | 觀察到的狀態                      | 使用時機                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | 私有網路 SSRF 逃逸開關 | 設為 `false`，要求私有網路存取保持停用。 |

#### 入口與通道存取

| 政策欄位                                  | 觀察到的狀態                                                 | 使用時機                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 要求經審查的直接訊息隔離範圍。                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 和舊版頻道 DM 政策欄位      | 只允許經審查的直接訊息頻道政策。               |
| `ingress.channels.denyOpenGroups`         | 頻道、帳號和群組入口政策                     | 對已設定的頻道和帳號拒絕開放群組入口。      |
| `ingress.channels.requireMentionInGroups` | 頻道、帳號、群組、guild 和巢狀提及閘門設定 | 在群組入口開放或受提及閘門控管時要求提及閘門。 |

#### 閘道

| 政策欄位                            | 觀察到的狀態                                 | 使用時機                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | 設為 `false` 以要求 local loopback 閘道繫結。                                  |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel 閘道態勢         | 設為 `false` 以拒絕 Tailscale Funnel 暴露。                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 設為 `true` 以拒絕停用的閘道驗證。                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 設為 `true` 以要求明確的驗證速率限制設定。                            |
| `gateway.controlUi.allowInsecure`       | Control UI 不安全的驗證/裝置/來源切換 | 設為 `false` 以拒絕不安全的 Control UI 暴露切換。                         |
| `gateway.remote.allow`                  | 遠端閘道模式/設定                     | 設為 `false` 以拒絕遠端閘道模式。                                          |
| `gateway.http.denyEndpoints`            | 閘道 HTTP API 端點                     | 拒絕端點 ID，例如 `chatCompletions` 或 `responses`。                          |
| `gateway.http.requireUrlAllowlists`     | 閘道 HTTP URL 擷取輸入                  | 設為 `true` 以要求 URL 擷取輸入具備 URL 允許清單。                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | 要求在 OpenClaw 設定中拒絕精確的節點命令 ID，例如 `system.run`。 |

`gateway.nodes.denyCommands` 是精確、區分大小寫的拒絕超集合規則。
當政策必須證明 OpenClaw 設定已明確拒絕具特權的節點命令時，請使用它。
若部署有意允許具特權的節點命令，應在審查後更新
`policy.jsonc`，而不是只依賴
`gateway.nodes.allowCommands`。

#### Agent 工作區

| 政策欄位                     | 觀察到的狀態                                                                        | 使用時機                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 和 `agents.list[].sandbox.workspaceAccess` | 只允許沙箱工作區存取值，例如 `none` 或 `ro`。                       |
| `agents.workspace.denyTools`     | 全域和每個 Agent 的工具拒絕設定                                                 | 要求拒絕變更工具（`exec`、`process`、`write`、`edit`、`apply_patch`）。 |

#### 沙箱態勢

| 政策欄位                                          | 觀察到的狀態                                          | 使用時機                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 和每個 Agent 的模式       | 只允許經審查的沙箱模式，例如 `all` 或 `non-main`。 |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 和每個 Agent 的後端 | 只允許經審查的沙箱後端，例如 `docker`。         |
| `sandbox.containers.denyHostNetwork`                  | 容器支援的沙箱/瀏覽器網路模式           | 拒絕主機網路模式。                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | 容器支援的沙箱/瀏覽器網路模式           | 拒絕加入另一個容器網路命名空間。              |
| `sandbox.containers.requireReadOnlyMounts`            | 容器支援的沙箱/瀏覽器掛載模式             | 要求掛載為唯讀。                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 容器支援的沙箱/瀏覽器掛載目標          | 拒絕容器執行階段 socket 掛載。                          |
| `sandbox.containers.denyUnconfinedProfiles`           | 容器安全性設定檔態勢                      | 拒絕無限制的容器安全性設定檔。                   |
| `sandbox.browser.requireCdpSourceRange`               | 沙箱瀏覽器 CDP 來源範圍                        | 要求瀏覽器 CDP 暴露宣告來源範圍。        |

政策會將缺少的 `sandbox.mode` 視為其隱含預設值 `off`，因此
`sandbox.requireMode` 會將全新或未設定的沙箱回報為不在
允許清單（例如 `["all"]`）內。

#### 資料處理

| 政策欄位                                        | 觀察到的狀態                                                                       | 使用時機                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | 設為 `true` 以拒絕 `logging.redactSensitive: "off"`。              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | 設為 `true` 以拒絕遙測內容擷取。                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 設為 `true` 以要求有效的工作階段維護模式為 `enforce`。 |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 和 `agents.*.memorySearch.experimental.sessionMemory` | 設為 `true` 以拒絕將工作階段逐字稿索引到記憶體中。       |

#### 秘密

| 政策欄位                      | 觀察到的狀態                                           | 使用時機                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | Config SecretRefs 和 `secrets.providers.*` 宣告 | 設為 `true` 以要求 SecretRefs 指向已宣告的提供者。     |
| `secrets.denySources`             | 秘密提供者來源和 SecretRef 來源            | 拒絕來源，例如 `exec`、`file` 或另一個已設定的來源名稱。 |
| `secrets.allowInsecureProviders`  | 不安全秘密提供者態勢旗標                   | 設為 `false` 以拒絕選擇不安全態勢的提供者。      |

#### Exec 核准

Exec 核准檢查會讀取執行階段 `exec-approvals.json` 成品：
預設為 `~/.openclaw/exec-approvals.json`，或在設定
`OPENCLAW_STATE_DIR` 時為
`$OPENCLAW_STATE_DIR/exec-approvals.json`。
`execApprovals.defaults.*` 或 `execApprovals.agents.*`
下的態勢規則要求可讀的成品證據；缺少或無效的成品會回報為
不可觀察的證據，而不是盡力通過。可讀後，省略的
欄位會繼承執行階段預設值：缺少的 `defaults.security` 為 `full`，而
缺少的 Agent security 會繼承該預設值。證據包含 `defaults`、
`agents.*`、`agents.*.allowlist[].pattern`、選用的 `argPattern`、有效的
`autoAllowSkills` 態勢，以及項目來源；絕不包含 socket path/token、
`commandText`、`lastUsedCommand`、已解析路徑或時間戳記。

| 政策欄位                                | 觀察到的狀態                                                                         | 使用時機                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 作用中執行階段 `exec-approvals.json` 路徑                                              | 設為 `true` 以要求核准成品存在且可剖析。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`，預設為 `full`                                              | 只允許已核准的預設核准安全模式。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`，繼承預設值                                               | 只允許已核准的每個 Agent 有效核准安全模式。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 和 `agents.*.autoAllowSkills`，繼承執行階段預設值 | 設為 `false` 以要求嚴格的手動允許清單，不含隱含的 skill 命令列介面核准。 |
| `execApprovals.agents.allowlist.expected`   | 彙總的 `agents.*.allowlist[]` pattern 和選用 argPattern 項目               | 要求核准允許清單符合經審查的 pattern 集合。                      |

範例：要求核准成品、拒絕寬鬆的預設值，並只允許
所選 Agent 使用經審查的 exec 核准態勢。

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

| 政策欄位                        | 觀察到的狀態                                 | 使用時機                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` provider 和 mode metadata | 要求設定驗證設定檔上有 `provider` 和 `mode` 等 metadata key。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | 僅允許支援的驗證設定檔模式，例如 `api_key`、`aws-sdk`、`oauth` 或 `token`。 |

#### 工具 metadata

| 政策欄位                | 觀察到的狀態                   | 使用時機                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 受治理的 `TOOLS.md` declarations | 要求受治理的工具宣告 `risk`、`sensitivity` 或 `owner` 等 metadata key。 |

#### 工具姿態

| 政策欄位                        | 觀察到的狀態                                              | 使用時機                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 和 `agents.list[].tools.profile`           | 僅允許工具設定檔 id，例如 `minimal`、`messaging` 或 `coding`。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 和每個 agent 的 `tools.fs` 覆寫 | 設為 `true` 以要求僅限工作區的檔案系統工具姿態。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` 和每個 agent 的 exec security           | 僅允許 exec security 模式，例如 `deny` 或 `allowlist`。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` 和每個 agent 的 exec ask mode                | 要求核准姿態，例如 `always`。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` 和每個 agent 的 exec host routing           | 僅允許 exec host routing 模式，例如 `sandbox`。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` 和每個 agent 的 elevated posture     | 設為 `false` 以要求 elevated tool mode 保持停用。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 和每個 agent 的 `tools.alsoAllow`           | 要求精確的 `alsoAllow` 項目，並回報缺少或非預期新增的工具授權。                 |
| `tools.denyTools`               | `tools.deny` 和 `agents.list[].tools.deny`                 | 要求已設定的工具拒絕清單包含工具 id 或群組，例如 `group:runtime` 和 `group:fs`。 |

## 執行檢查

撰寫期間執行僅限政策的檢查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 只會執行政策檢查集，並輸出證據、發現項目
和 attestation hashes。啟用 Policy 外掛時，相同的發現項目也會出現在
`openclaw doctor --lint` 中。

將 operator 政策檔與已撰寫的基準進行比較：

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` 會檢查政策檔語法與政策檔語法；它不會
檢查執行階段狀態、證據、認證資料或 secret。它使用與 scoped overlays 相同的
規則 metadata：allowlist 必須保持相等或更窄，
denylist 必須保持相等或更廣，必要布林值必須保持
其值，有序字串只能往設定順序中更嚴格的一端移動，
而精確清單必須相符。基準可以是
組織撰寫的政策；被檢查的政策可以加入更嚴格的值或
額外規則。當 top-level 被檢查規則同樣嚴格或更嚴格時，
可以滿足 scoped baseline rule。檔案之間的 scope 名稱不需要相符；
比較會依 selector（`agentIds`/`channelIds`）和欄位 keyed。

乾淨比較（`--json`）：

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

乾淨的 `policy check --json` 輸出包含 operator 或
supervisor 可記錄的穩定 hash：

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

| 設定                      | 用途                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | 即使 `policy.jsonc` 尚不存在，也啟用政策檢查。         |
| `workspaceRepairs`        | 允許 `doctor --fix` 編輯由政策管理的工作區設定。 |
| `expectedHash`            | 已核准政策 artifact 的選用 hash-lock。            |
| `expectedAttestationHash` | 上一次已接受乾淨政策檢查的選用 hash-lock。    |
| `path`                    | 政策 artifact 的工作區相對位置。             |

將 `plugins.entries.policy.config.enabled` 設為 `false` 可停用某個工作區的政策
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

`attestation.policy.hash` 會識別已撰寫的規則 artifact。`evidence`
會記錄檢查所使用的已觀察 OpenClaw 狀態，而
`workspace.hash` 會識別該證據 payload。`findingsHash` 會識別
精確的發現項目集。`checkedAt` 會記錄檢查執行時間。
`attestationHash` 會識別穩定 claim（policy hash、evidence hash、
findings hash，以及 clean/dirty state），並刻意排除 `checkedAt`，
因此相同的政策狀態永遠會產生相同的 attestation hash。這四個值
共同構成一次政策檢查的 audit tuple。

如果閘道或 supervisor 使用政策來封鎖、核准或註記
執行階段動作，它應該記錄上一次乾淨檢查的 attestation hash。
`checkedAt` 會保留在 JSON 輸出中供 audit log 使用，但不是
stable hash 的一部分。

接受政策狀態的生命週期：

1. 撰寫或檢閱 `policy.jsonc`。
2. 執行 `openclaw policy check --json`。
3. 如果乾淨，將 `attestation.policy.hash` 記錄為 `expectedHash`。
4. 將 `attestation.attestationHash` 記錄為 `expectedAttestationHash`。
5. 在 CI 或 release gates 中重新執行 `openclaw doctor --lint`。

如果政策規則是刻意變更，請從乾淨檢查更新兩個已接受的雜湊。如果只有工作區設定變更（政策維持相同），通常只會變更 `expectedAttestationHash`。

啟用或升級 `agents.workspace` 規則會將 `agentWorkspace` 證據加入工作區雜湊與證明雜湊；啟用後請審查新的證據，並重新整理已接受的證明雜湊。啟用或升級工具姿態規則，也會以相同方式加入 `toolPosture` 證據。

`openclaw policy watch` 會重新執行檢查，並在目前證據不再符合 `expectedAttestationHash` 時回報：

```bash
openclaw policy watch --json
```

在 CI 或需要單次漂移評估的指令碼中使用 `--once`。若沒有 `--once`，預設每兩秒輪詢一次；使用 `--interval-ms` 可變更間隔。

## 發現項目

| 檢查 ID                                                 | 發現項目                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 政策已啟用，但缺少 `policy.jsonc`。                                  |
| `policy/policy-jsonc-invalid`                            | 政策無法剖析，或包含格式錯誤的規則項目。                       |
| `policy/policy-hash-mismatch`                            | 政策不符合設定的 `expectedHash`。                                  |
| `policy/attestation-hash-mismatch`                       | 目前政策證據不再符合已接受的證明。               |
| `policy/policy-conformance-invalid`                      | 基準或受檢查的政策檔案含有無效的比較語法。                  |
| `policy/policy-conformance-missing`                      | 受檢查的政策檔案缺少基準政策檔案要求的規則。     |
| `policy/policy-conformance-weaker`                       | 受檢查的政策檔案值比基準政策檔案更弱。           |
| `policy/channels-denied-provider`                        | 已啟用的頻道符合頻道拒絕規則。                                   |
| `policy/mcp-denied-server`                               | 已設定的 MCP 伺服器遭政策拒絕。                                      |
| `policy/mcp-unapproved-server`                           | 已設定的 MCP 伺服器位於允許清單之外。                                 |
| `policy/models-denied-provider`                          | 已設定的模型供應商或模型參照使用遭拒絕的供應商。                  |
| `policy/models-unapproved-provider`                      | 已設定的模型供應商或模型參照位於允許清單之外。                |
| `policy/network-private-access-enabled`                  | 政策拒絕時，卻啟用了私人網路 SSRF 逃生出口。             |
| `policy/ingress-dm-policy-unapproved`                    | 頻道 DM 政策位於政策允許清單之外。                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` 不符合政策要求的 DM 隔離範圍。          |
| `policy/ingress-open-groups-denied`                      | 政策拒絕開放群組入口時，頻道群組政策為 `open`。          |
| `policy/ingress-group-mention-required`                  | 政策要求提及閘門時，頻道或群組項目卻停用提及閘門。       |
| `policy/gateway-non-loopback-bind`                       | 政策拒絕時，Gateway 綁定姿態卻允許非 loopback 暴露。         |
| `policy/gateway-auth-disabled`                           | 政策要求驗證時，Gateway 驗證卻已停用。                     |
| `policy/gateway-rate-limit-missing`                      | 政策要求時，Gateway 驗證速率限制姿態未明確設定。          |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI 的不安全暴露切換已啟用。                         |
| `policy/gateway-tailscale-funnel`                        | 政策拒絕時，Gateway Tailscale Funnel 暴露卻已啟用。               |
| `policy/gateway-remote-enabled`                          | 政策拒絕時，Gateway 遠端模式卻處於啟用狀態。                              |
| `policy/gateway-http-endpoint-enabled`                   | 政策拒絕時，Gateway HTTP API 端點卻已啟用。                    |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL 擷取輸入缺少必要的 URL 允許清單。                      |
| `policy/gateway-node-command-denied`                     | 政策拒絕的節點命令未被 OpenClaw 設定拒絕。                 |
| `policy/agents-workspace-access-denied`                  | Agent 沙盒模式或工作區存取位於政策允許清單之外。           |
| `policy/agents-tool-not-denied`                          | Agent 或預設設定未拒絕政策要求拒絕的工具。               |
| `policy/tools-profile-unapproved`                        | 已設定的全域或個別 Agent 工具設定檔位於允許清單之外。           |
| `policy/tools-fs-workspace-only-required`                | 檔案系統工具未設定為僅限工作區路徑姿態。             |
| `policy/tools-exec-security-unapproved`                  | 執行安全模式位於政策允許清單之外。                               |
| `policy/tools-exec-ask-unapproved`                       | 執行詢問模式位於政策允許清單之外。                                    |
| `policy/tools-exec-host-unapproved`                      | 執行主機路由位於政策允許清單之外。                                |
| `policy/tools-elevated-enabled`                          | 政策拒絕時，提升權限工具模式卻已啟用。                              |
| `policy/tools-also-allow-missing`                        | 已設定的 `alsoAllow` 清單缺少政策要求的項目。             |
| `policy/tools-also-allow-unexpected`                     | 已設定的 `alsoAllow` 清單包含政策未預期的項目。           |
| `policy/tools-required-deny-missing`                     | 全域或個別 Agent 工具拒絕清單未包含必要的遭拒絕工具。     |
| `policy/sandbox-mode-unapproved`                         | 沙盒模式位於政策允許清單之外。                                     |
| `policy/sandbox-backend-unapproved`                      | 沙盒後端位於政策允許清單之外。                                  |
| `policy/sandbox-container-posture-unobservable`          | 已為無法觀察容器姿態的後端啟用容器姿態規則。         |
| `policy/sandbox-container-host-network-denied`           | 容器支援的沙盒或瀏覽器使用主機網路模式。                     |
| `policy/sandbox-container-namespace-join-denied`         | 容器支援的沙盒或瀏覽器加入另一個容器命名空間。          |
| `policy/sandbox-container-mount-mode-required`           | 容器支援的沙盒或瀏覽器掛載不是唯讀。                     |
| `policy/sandbox-container-runtime-socket-mount`          | 容器支援的沙盒或瀏覽器掛載暴露容器執行階段通訊端。 |
| `policy/sandbox-container-unconfined-profile`            | 政策拒絕時，容器沙盒設定檔卻為不受限制。                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | 政策要求時，沙盒瀏覽器 CDP 來源範圍缺失。             |
| `policy/data-handling-redaction-disabled`                | 政策要求時，敏感記錄遮罩卻已停用。                  |
| `policy/data-handling-telemetry-content-capture`         | 政策拒絕時，遙測內容擷取卻已啟用。                       |
| `policy/data-handling-session-retention-not-enforced`    | 政策要求時，工作階段保留維護未強制執行。            |
| `policy/data-handling-session-transcript-memory-enabled` | 政策拒絕時，工作階段轉錄記憶索引卻已啟用。              |
| `policy/secrets-unmanaged-provider`                      | 設定 SecretRef 參照未在 `secrets.providers` 下宣告的供應商。  |
| `policy/secrets-denied-provider-source`                  | 設定秘密供應商或 SecretRef 使用政策拒絕的來源。             |
| `policy/secrets-insecure-provider`                       | 政策拒絕時，秘密供應商卻選擇使用不安全姿態。               |
| `policy/auth-profile-invalid-metadata`                   | 設定驗證設定檔缺少有效的供應商或模式中繼資料。                 |
| `policy/auth-profile-unapproved-mode`                    | 設定驗證設定檔模式位於政策允許清單之外。                       |
| `policy/exec-approvals-missing`                          | 政策要求 `exec-approvals.json`，但缺少該成品。               |
| `policy/exec-approvals-invalid`                          | 已設定的執行核准成品無法剖析。                          |
| `policy/exec-approvals-default-security-unapproved`      | 執行核准預設值使用位於政策允許清單之外的安全模式。          |
| `policy/exec-approvals-agent-security-unapproved`        | 個別 Agent 的有效執行核准安全模式位於允許清單之外。       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 政策拒絕時，執行核准 Agent 卻隱含自動允許 Skills 命令列介面。   |
| `policy/exec-approvals-allowlist-missing`                | 核准允許清單缺少政策要求的模式。                  |
| `policy/exec-approvals-allowlist-unexpected`             | 核准允許清單包含政策未預期的模式。                |
| `policy/tools-missing-risk-level`                        | 受治理的工具宣告缺少風險中繼資料。                             |
| `policy/tools-unknown-risk-level`                        | 受治理的工具宣告使用未知的風險值。                           |
| `policy/tools-missing-sensitivity-token`                 | 受治理的工具宣告缺少敏感度中繼資料。                      |
| `policy/tools-missing-owner`                             | 受治理的工具宣告缺少擁有者中繼資料。                            |
| `policy/tools-unknown-sensitivity-token`                 | 受治理的工具宣告使用未知的敏感度值。                    |

發現項目可以同時包含 `target`（觀察到不符合的工作區項目）與 `requirement`（使其成為發現項目的作者規則）。兩者目前都是 `oc://` 位址字串，但欄位名稱描述的是政策角色，而不是位址格式。

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

`doctor --lint` 和 `policy check` 為唯讀。

只有在明確啟用 `workspaceRepairs` 時，`doctor --fix` 才會編輯由政策管理的工作區設定；否則檢查只會回報它們會修復的內容，並保持設定不變。

在此版本中，修復可以停用被 `channels.denyRules` 拒絕的頻道，並套用下列自動縮窄修復。只有在政策檔已完成審查後，才啟用 `workspaceRepairs`，因為有效規則可能會變更工作區設定：

- 當全域政策禁止提升權限工具時，設定 `tools.elevated.enabled=false`
- 當政策要求拒絕這些工具時，將缺少的必要拒絕工具 ID 新增至 `tools.deny` 或
  `agents.list[].tools.deny`
- 將不安全的 `gateway.controlUi.*` 開關設定為 `false`
- 當政策拒絕遠端閘道模式時，設定 `gateway.mode=local`
- 當政策要求遮蔽敏感記錄時，設定 `logging.redactSensitive=tools`
- 當政策拒絕擷取遙測內容時，設定 `diagnostics.otel.captureContent=false`，或針對物件形式的遙測
  擷取設定，設定 `diagnostics.otel.captureContent.enabled=false`

作用域提升權限工具修復僅會偵測。當發現項目回報共用記錄或遙測設定時，也會略過作用域資料處理修復，
因為變更共用設定會影響超出作用域政策目標的範圍。

當發現項目回報繼承自根層級的 `tools.deny` 時，會略過作用域必要拒絕修復，因為將必要工具新增至根設定
會影響超出作用域政策目標的範圍。代理程式本機的必要拒絕修復可以更新回報的
`agents.list[].tools.deny` 路徑。

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

## 退出代碼

| Command          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | 在門檻值下沒有發現項目。                          | 一個或多個發現項目符合門檻值。                             | 引數或執行階段失敗。 |
| `policy compare` | 政策檔至少與基準一樣嚴格。 | 政策檔無效、缺少，或比基準規則更寬鬆。 | 引數或執行階段失敗。 |
| `policy watch`   | 沒有發現項目，且已接受的雜湊為最新。              | 存在發現項目，或已接受的證明已過期。                    | 引數或執行階段失敗。 |

## 相關

- [Doctor lint 模式](/zh-TW/cli/doctor#lint-mode)
- [Path 命令列介面](/zh-TW/cli/path)
