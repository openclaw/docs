---
read_when:
    - 你想根據編寫的 policy.jsonc 檢查 OpenClaw 設定
    - 你希望 doctor lint 中有政策發現
    - 您需要政策證明雜湊作為稽核證據
summary: '`openclaw policy` 一致性檢查的命令列介面參考'
title: 政策
x-i18n:
    generated_at: "2026-06-27T19:07:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` 由內建的 Policy 外掛提供。Policy 是建立在現有 OpenClaw 設定之上的企業合規層。它不會新增第二套設定系統。`policy.jsonc` 定義撰寫好的要求，OpenClaw 會觀察作用中的工作區作為證據，而 policy 健康檢查會透過 `doctor --lint` 回報偏移。最終的合規訊號是一次乾淨的 `doctor --lint` 執行；policy 會將 findings 貢獻到這個共用的 lint 介面，而不是建立獨立的健康閘門。

Policy 目前管理已設定的通道、MCP 伺服器、模型提供者、網路 SSRF 姿態、入口/通道存取姿態、閘道暴露姿態、代理工作區姿態、資料處理姿態、OpenClaw 設定密鑰提供者/驗證設定檔姿態，以及受治理工具宣告。例如，IT 或工作區操作員可以記錄 Telegram 不是核准的通道提供者、將 MCP 伺服器和模型參照限制為核准項目、要求私人網路 fetch/browser 存取保持停用、要求直接訊息工作階段隔離與通道入口姿態維持在已審查界限內、要求閘道 bind/auth/HTTP 暴露維持在已審查界限內、要求代理工作區存取和工具拒絕維持在已審查姿態、要求 OpenClaw 設定 SecretRefs 使用受管理提供者、要求設定驗證設定檔帶有 provider/mode metadata、要求受治理工具帶有風險與敏感度 metadata、要求敏感記錄遮罩、拒絕遙測內容擷取、要求工作階段保留維護、拒絕工作階段 transcript 記憶索引，然後使用 `doctor --lint` 作為共用合規閘門。

當工作區需要可持久保存的聲明，例如「這些通道不得啟用」或「受治理工具必須宣告核准 metadata」，並且需要可重複證明 OpenClaw 仍符合該聲明時，請使用 policy。當你只需要本機行為，且不需要 policy findings 或 attestation 輸出時，只使用一般設定和工作區文件即可。

## 快速開始

首次使用前，先啟用內建的 Policy 外掛：

```bash
openclaw plugins enable policy
```

啟用 policy 後，doctor 可以載入 policy 健康檢查，而不會啟用任意外掛。即使缺少 `policy.jsonc`，外掛仍會保持啟用，因此 doctor 可以回報缺少的 artifact。

Policy 是撰寫出來的，不是從使用者目前的設定產生。通道、MCP 伺服器、模型提供者、網路姿態、入口/通道存取、閘道暴露、代理工作區姿態、已設定的 sandbox 執行階段姿態、OpenClaw 資料處理姿態、設定密鑰提供者/驗證設定檔姿態、exec 核准檔案姿態，以及工具 metadata 的最小 policy 如下：

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

規則才是權威。類別區塊只是命名空間；只有存在具體規則時才會執行檢查。OpenClaw 會讀取目前的 `channels.*` 設定、`mcp.servers.*`、`models.providers.*`、選取的代理模型參照、網路 SSRF 設定、直接訊息工作階段範圍、通道 DM policy、通道群組 policy、通道/群組提及閘門、閘道 bind/auth/Control UI/Tailscale/remote/HTTP 姿態、OpenClaw 設定代理 sandbox 工作區存取與工具拒絕姿態、資料處理設定姿態、設定密鑰提供者與 SecretRef 來源、設定驗證設定檔 metadata、已設定的全域/每代理工具姿態，以及 `TOOLS.md` 宣告作為證據，然後回報不符合的觀察狀態。如果 policy 拒絕非 local loopback 的閘道 bind，只有在你願意審查執行階段預設值時才省略 `gateway.bind`；若要嚴格設定合規，請設定 `gateway.bind=loopback`。若是唯讀代理姿態，請在適用的預設值或代理上設定 sandbox 模式，並將 `workspaceAccess` 設為 `none` 或 `ro`；省略或 `off` sandbox 模式不符合唯讀/禁止寫入 policy。`agents.workspace.denyTools` 支援 `exec`、`process`、`write`、`edit` 和 `apply_patch`；OpenClaw 設定 `group:fs` 涵蓋檔案變更工具，而 `group:runtime` 涵蓋 shell/process 工具。工具姿態 policy 會觀察 `tools.profile`、`tools.allow`、`tools.alsoAllow`、`tools.deny`、`tools.fs.workspaceOnly`、`tools.exec.security`、`tools.exec.ask`、`tools.exec.host`、`tools.elevated.enabled`，以及相同的每代理 `agents.list[].tools.*` 覆寫。只有存在 `execApprovals` 規則時，Exec 核准 policy 才會讀取具名的 `exec-approvals.json` 產品 artifact；證據會記錄預設值、每代理姿態和 allowlist patterns，但不含 socket tokens 或 last-used command text。Policy 不會在執行階段強制工具呼叫。密鑰證據會記錄 provider/source 姿態與 SecretRef metadata，絕不記錄原始密鑰值。Policy 不會讀取或 attestation 每代理憑證儲存區，例如 `auth-profiles.json`；這些儲存區仍由現有的驗證與憑證流程擁有。資料處理證據只涵蓋設定層級姿態：它會檢查已設定的遮罩模式、遙測內容擷取切換、工作階段維護模式，以及工作階段 transcript 記憶索引設定。它不會檢查原始記錄、遙測匯出、transcript 內容、記憶檔案，也不會證明不存在個人資料或密鑰。

### Policy 規則參考

下方每個 policy 欄位都是選用的。只有 `policy.jsonc` 中存在相符規則時才會執行檢查。觀察狀態是現有 OpenClaw 設定或工作區 metadata；policy 會回報偏移，但不會改寫執行階段行為，除非明確存在並啟用 repair path。
Policy 檔案是嚴格的：不支援的 sections 或 rule keys 會被回報為 `policy/policy-jsonc-invalid`，而不是被忽略。

Policy overlays 會讓廣泛的頂層規則維持全域，然後讓具名 scope 區塊為明確 selectors 加上更嚴格的一般 policy sections。Scope 名稱只是描述性 bucket；比對會使用 scope 內的 selector values。
Overlay 是累加的：全域 claims 仍會執行，而 scoped claim 可以針對相同的觀察設定發出自己的 finding。

#### Scoped overlays

當一組代理或通道需要比頂層 baseline 更嚴格的 policy 時，請使用 `scopes.<scopeName>`。代理 scoped sections 使用 `agentIds`，支援 `tools.*`、`agents.workspace.*`、`sandbox.*`、`dataHandling.memory.*` 和 `execApprovals.*`。通道 scoped 入口使用 `channelIds`，支援 `ingress.channels.*`。不支援的 sections 會被拒絕，而不是被忽略。如果 `agentIds` 項目不存在於 `agents.list[]`，OpenClaw 會針對該執行階段代理 id 的繼承全域/預設姿態評估 scoped rule。

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

如上所示，當每個 scope 治理不同欄位時，同一個代理可以出現在多個 scopes 中。同一代理的重複 scoped field 必須依照 policy metadata 具有相同或更嚴格限制；較弱的重複 claims 會被拒絕。嚴格性 metadata 會將 allow-lists 視為 subsets、deny-lists 視為 supersets，並將 required booleans 視為固定要求。

Container 姿態 policy 只會根據 OpenClaw 能針對相符代理觀察到的證據進行評估。如果已啟用的 `sandbox.containers.*` 規則套用到其 sandbox backend 無法暴露該欄位的代理，policy 會回報 `policy/sandbox-container-posture-unobservable`，而不是將 claim 視為通過。針對使用不同 sandbox backends 的代理群組，請使用獨立的 `agentIds` scopes，並在無法觀察那些欄位的群組中將不支援的 container rules 保持 unset 或 false。

頂層 `ingress.session.requireDmScope` 維持全域，因為 `session.dmScope` 不是可歸屬到通道的證據。

| 選擇器       | 支援的區段                                                                         | 使用時機                                   |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------ |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, and `execApprovals` | 一個或多個執行階段代理需要更嚴格的規則。 |
| `channelIds` | `ingress.channels`                                                                 | 一個或多個通道需要更嚴格的傳入規則。     |

`policy.jsonc` 中存在的每個範圍都必須有效且可強制執行。

#### 通道

| 政策欄位                             | 觀察到的狀態                            | 使用時機                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` 提供者與啟用狀態          | 拒絕來自 `telegram` 等提供者的已設定通道。                  |
| `channels.denyRules[].reason`        | 發現訊息與修復提示脈絡                  | 說明為何拒絕該提供者。                                      |

#### MCP 伺服器

| 政策欄位            | 觀察到的狀態        | 使用時機                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ids | 要求每個已設定的 MCP 伺服器都在允許清單中。               |
| `mcp.servers.deny`  | `mcp.servers.*` ids | 拒絕特定已設定的 MCP 伺服器 id。                          |

#### 模型提供者

| 政策欄位                 | 觀察到的狀態                                      | 使用時機                                                                       |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `models.providers.allow` | `models.providers.*` ids 和已選取的模型參照      | 要求已設定的提供者與已選取的模型參照使用核准的提供者。                       |
| `models.providers.deny`  | `models.providers.*` ids 和已選取的模型參照      | 依提供者 id 拒絕已設定的提供者與已選取的模型參照。                           |

#### 網路

| 政策欄位                       | 觀察到的狀態                    | 使用時機                                                           |
| ------------------------------ | -------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | 私有網路 SSRF 逃逸途徑          | 設為 `false`，要求私有網路存取保持停用。                          |

#### 傳入與通道存取

| 政策欄位                                  | 觀察到的狀態                                                   | 使用時機                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 要求經審查的直接訊息隔離範圍。                                   |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 和舊版通道 DM 政策欄位                  | 只允許經審查的直接訊息通道政策。                                 |
| `ingress.channels.denyOpenGroups`         | 通道、帳戶與群組傳入政策                                      | 拒絕已設定通道與帳戶的開放群組傳入。                             |
| `ingress.channels.requireMentionInGroups` | 通道、帳戶、群組、guild 與巢狀提及閘門設定                    | 當群組傳入開放或受提及閘門管控時，要求提及閘門。                 |

#### 閘道

| 政策欄位                                | 觀察到的狀態                                  | 使用時機                                                     |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                | 設為 `false`，要求 local loopback 閘道繫結。                |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel 閘道暴露狀態           | 設為 `false`，拒絕 Tailscale Funnel 暴露。                  |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                           | 設為 `true`，拒絕停用的閘道驗證。                           |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                      | 設為 `true`，要求明確的驗證速率限制設定。                   |
| `gateway.controlUi.allowInsecure`       | Control UI 不安全的驗證/裝置/來源切換        | 設為 `false`，拒絕不安全的 Control UI 暴露切換。            |
| `gateway.remote.allow`                  | 遠端閘道模式/設定                             | 設為 `false`，拒絕遠端閘道模式。                            |
| `gateway.http.denyEndpoints`            | 閘道 HTTP API 端點                            | 拒絕 `chatCompletions` 或 `responses` 等端點 id。            |
| `gateway.http.requireUrlAllowlists`     | 閘道 HTTP URL 擷取輸入                        | 設為 `true`，要求 URL 擷取輸入使用 URL 允許清單。            |

#### 代理工作區

| 政策欄位                         | 觀察到的狀態                                                                        | 使用時機                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 和 `agents.list[].sandbox.workspaceAccess` | 只允許 `none` 或 `ro` 等沙箱工作區存取值。                                                                          |
| `agents.workspace.denyTools`     | 全域與每代理工具拒絕設定                                                            | 要求拒絕 `exec`、`process`、`write`、`edit` 或 `apply_patch` 等工作區/執行階段變更工具。                           |

#### 沙箱狀態

| 政策欄位                                              | 觀察到的狀態                                             | 使用時機                                                       |
| ----------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 和每代理模式             | 只允許 `all` 或 `non-main` 等經審查的沙箱模式。               |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 和每代理後端          | 只允許 `docker` 等經審查的沙箱後端。                          |
| `sandbox.containers.denyHostNetwork`                  | 容器支援的沙箱/瀏覽器網路模式                           | 拒絕主機網路模式。                                             |
| `sandbox.containers.denyContainerNamespaceJoin`       | 容器支援的沙箱/瀏覽器網路模式                           | 拒絕加入另一個容器網路命名空間。                               |
| `sandbox.containers.requireReadOnlyMounts`            | 容器支援的沙箱/瀏覽器掛載模式                           | 要求掛載為唯讀。                                               |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 容器支援的沙箱/瀏覽器掛載目標                           | 拒絕容器執行階段 socket 掛載。                                 |
| `sandbox.containers.denyUnconfinedProfiles`           | 容器安全性設定檔狀態                                    | 拒絕不受限制的容器安全性設定檔。                               |
| `sandbox.browser.requireCdpSourceRange`               | 沙箱瀏覽器 CDP 來源範圍                                 | 要求瀏覽器 CDP 暴露宣告來源範圍。                              |

政策會將缺少的 `sandbox.mode` 視為隱含預設值 `off`，因此
`sandbox.requireMode` 會將全新或未設定的沙箱回報為不在
`["all"]` 等允許清單內。

#### 資料處理

| 政策欄位                                            | 觀察到的狀態                                                                       | 使用時機                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                          | 設為 `true`，拒絕 `logging.redactSensitive: "off"`。                  |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                  | 設為 `true`，拒絕遙測內容擷取。                                       |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                         | 設為 `true`，要求有效的工作階段維護模式 `enforce`。                   |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 和 `agents.*.memorySearch.experimental.sessionMemory` | 設為 `true`，拒絕將工作階段逐字稿索引到記憶體。                       |

#### 密鑰

| 政策欄位                          | 觀察到的狀態                                             | 使用時機                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 設定 SecretRefs 與 `secrets.providers.*` 宣告            | 設為 `true`，要求 SecretRefs 指向已宣告的提供者。                       |
| `secrets.denySources`             | 密鑰提供者來源與 SecretRef 來源                         | 拒絕 `exec`、`file` 或另一個已設定來源名稱等來源。                     |
| `secrets.allowInsecureProviders`  | 不安全的密鑰提供者狀態旗標                              | 設為 `false`，拒絕選擇採用不安全狀態的提供者。                         |

#### Exec 核准

Exec 核准政策會觀察作用中的執行階段 `exec-approvals.json`
成品。預設為 `~/.openclaw/exec-approvals.json`；當設定
`OPENCLAW_STATE_DIR` 時，政策會讀取
`$OPENCLAW_STATE_DIR/exec-approvals.json`。實際狀態規則，例如
`execApprovals.defaults.*` 或 `execApprovals.agents.*`，需要可讀取的成品
證據；缺少或無效的成品會回報為不可觀察的證據，而不是針對合成執行階段預設值
成為盡力而為的通過。一旦成品可讀取，省略的核准欄位會繼承執行階段預設值：缺少的
`defaults.security` 為 `full`，缺少的代理安全性則繼承該
預設值。證據包含 `defaults`、`agents.*` 和
`agents.*.allowlist[].pattern`，以及選用的 `argPattern`、有效的
`autoAllowSkills` 狀態與項目來源。它不包含 socket
路徑/權杖、`commandText`、`lastUsedCommand`、解析後的路徑或時間戳記。

| 政策欄位                                    | 觀察到的狀態                                                                         | 使用時機                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 作用中的執行階段 `exec-approvals.json` 路徑                                              | 設為 `true` 以要求核准成品存在且可剖析。                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`，預設為 `full`                                              | 僅允許已核准的預設核准安全模式。                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`，繼承預設值                                               | 僅允許已核准的每代理有效核准安全模式。                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 和 `agents.*.autoAllowSkills`，繼承執行階段預設值 | 設為 `false` 以要求嚴格手動允許清單，不使用隱含的 skill 命令列介面核准。 |
| `execApprovals.agents.allowlist.expected`   | 彙總的 `agents.*.allowlist[]` pattern 和選用的 argPattern 項目               | 要求核准允許清單符合已審查的 pattern 集合。                      |

例如，要求核准成品、拒絕寬鬆的預設值，並且
只允許選定代理使用已審查的 exec 核准姿態：

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
| `auth.profiles.requireMetadata` | `auth.profiles.*` provider 和 mode 中繼資料 | 要求設定驗證設定檔上具備 `provider` 和 `mode` 等中繼資料鍵。               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | 僅允許支援的驗證設定檔模式，例如 `api_key`、`aws-sdk`、`oauth` 或 `token`。 |

#### 工具中繼資料

| 政策欄位            | 觀察到的狀態                   | 使用時機                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 受治理的 `TOOLS.md` 宣告 | 要求受治理的工具宣告 `risk`、`sensitivity` 或 `owner` 等中繼資料鍵。 |

#### 工具姿態

| 政策欄位                    | 觀察到的狀態                                              | 使用時機                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 和 `agents.list[].tools.profile`           | 僅允許工具設定檔 ID，例如 `minimal`、`messaging` 或 `coding`。                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 和每代理 `tools.fs` 覆寫 | 設為 `true` 以要求僅限工作區的檔案系統工具姿態。                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` 和每代理 exec 安全性           | 僅允許 exec 安全模式，例如 `deny` 或 `allowlist`。                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` 和每代理 exec 詢問模式                | 要求核准姿態，例如 `always`。                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` 和每代理 exec 主機路由           | 僅允許 exec 主機路由模式，例如 `sandbox`。                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` 和每代理提升權限姿態     | 設為 `false` 以要求提升權限工具模式保持停用。                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 和每代理 `tools.alsoAllow`           | 要求精確的 `alsoAllow` 項目，並回報缺少或非預期的附加工具授權。                 |
| `tools.denyTools`               | `tools.deny` 和 `agents.list[].tools.deny`                 | 要求已設定的工具拒絕清單包含工具 ID 或群組，例如 `group:runtime` 和 `group:fs`。 |

在撰寫期間執行僅限政策的檢查：

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` 只執行政策檢查集合，並輸出證據、發現項目和
證明雜湊。啟用 Policy 外掛時，相同發現項目也會出現在 `openclaw doctor --lint`
中。

將操作者政策檔與已撰寫的基準政策檔進行比較：

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` 會比較政策檔語法與政策檔語法。它不會
檢查 OpenClaw 執行階段狀態、證據、認證資料或秘密。此命令
使用與管理範圍覆疊相同的政策規則中繼資料：允許清單必須
保持相同或更窄，拒絕清單必須保持相同或更廣，必要布林值
必須保留其必要值，已排序字串只能朝向已設定順序中更
嚴格的一端移動，且精確清單必須相符。

基準檔可以是組織撰寫的政策。受檢查的政策可以
使用更嚴格的值或加入額外政策規則。當頂層受檢查規則同等或更嚴格時，也可以
滿足範圍化基準規則，因為
頂層政策會廣泛套用。範圍名稱不需要相符；範圍化
比較會依 `agentIds` 或 `channelIds` 等選擇器值，以及
正在檢查的政策欄位作為鍵。

乾淨比較 JSON 輸出範例只回報政策檔比較狀態：

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

乾淨的 `policy check --json` 輸出範例包含穩定雜湊，可由
操作者或監督者記錄：

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
| `enabled`                 | 即使在 `policy.jsonc` 存在之前，也啟用政策檢查。         |
| `workspaceRepairs`        | 允許 `doctor --fix` 編輯由政策管理的工作區設定。 |
| `expectedHash`            | 已核准政策成品的選用雜湊鎖定。            |
| `expectedAttestationHash` | 上次接受的乾淨政策檢查的選用雜湊鎖定。    |
| `path`                    | 政策成品相對於工作區的位置。             |

將 `plugins.entries.policy.config.enabled` 設為 `false`，即可在保留外掛安裝的情況下，
停用工作區的政策檢查。

工具中繼資料需求會在 `policy.jsonc` 中以
`tools.requireMetadata` 撰寫，例如 `["risk", "sensitivity", "owner"]`。

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

政策雜湊會識別已撰寫的規則成品。證據區塊會記錄政策檢查使用的已觀察 OpenClaw 狀態。`workspace.hash` 值會識別受檢範圍的該證據承載資料。發現項雜湊會識別檢查傳回的確切發現項集合。`checkedAt` 會記錄評估執行時間。證明雜湊會識別穩定聲明：政策雜湊、證據雜湊、發現項雜湊，以及結果是否乾淨。它刻意不包含 `checkedAt`，因此相同政策狀態在重複檢查時會產生相同證明。這些共同構成此政策檢查的稽核元組。

如果後續閘道或監督程式使用政策來封鎖、核准或註解執行階段動作，應記錄最後一次乾淨政策檢查的證明雜湊。`checkedAt` 會保留在 JSON 輸出中以供稽核記錄使用，但不是穩定證明雜湊的一部分。

接受政策狀態時，請使用此生命週期：

1. 撰寫或審閱 `policy.jsonc`。
2. 執行 `openclaw policy check --json`。
3. 如果結果乾淨，將 `attestation.policy.hash` 記錄為 `expectedHash`。
4. 將 `attestation.attestationHash` 記錄為 `expectedAttestationHash`。
5. 在 CI 或發行閘門中重新執行 `openclaw doctor --lint`。

如果有意變更政策規則，請從乾淨檢查更新兩個已接受的雜湊。如果有意變更工作區設定但政策維持不變，通常只有 `expectedAttestationHash` 會改變。

啟用或升級 `agents.workspace` 規則會將 `agentWorkspace` 證據加入工作區雜湊和證明雜湊。操作人員應審閱新的證據，並在啟用這些規則後重新整理已接受的證明雜湊。啟用或升級工具態勢規則會以相同方式加入 `toolPosture` 證據。

`openclaw policy watch` 會重複執行相同檢查，並在目前證據不再符合 `expectedAttestationHash` 時回報：

```bash
openclaw policy watch --json
```

在只需要一次漂移評估的 CI 或指令碼中使用 `--once`。若未使用 `--once`，此命令預設每兩秒輪詢一次；使用 `--interval-ms` 選擇不同間隔。

## 發現項

政策目前會驗證：

| 檢查 ID                                                 | 發現                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 已啟用政策，但缺少 `policy.jsonc`。                                               |
| `policy/policy-jsonc-invalid`                            | 無法剖析政策，或政策包含格式錯誤的規則項目。                                      |
| `policy/policy-hash-mismatch`                            | 政策與設定的 `expectedHash` 不符。                                                |
| `policy/attestation-hash-mismatch`                       | 目前的政策證據不再符合已接受的證明。                                              |
| `policy/policy-conformance-invalid`                      | 基準或已檢查的政策檔案包含無效的比較語法。                                        |
| `policy/policy-conformance-missing`                      | 已檢查的政策檔案缺少基準政策檔案要求的規則。                                      |
| `policy/policy-conformance-weaker`                       | 已檢查的政策檔案具有比基準政策檔案更弱的值。                                      |
| `policy/channels-denied-provider`                        | 已啟用的頻道符合頻道拒絕規則。                                                    |
| `policy/mcp-denied-server`                               | 已設定的 MCP 伺服器遭政策拒絕。                                                   |
| `policy/mcp-unapproved-server`                           | 已設定的 MCP 伺服器不在允許清單中。                                               |
| `policy/models-denied-provider`                          | 已設定的模型提供者或模型參照使用遭拒絕的提供者。                                  |
| `policy/models-unapproved-provider`                      | 已設定的模型提供者或模型參照不在允許清單中。                                      |
| `policy/network-private-access-enabled`                  | 政策拒絕時，仍啟用了私人網路 SSRF 逃生口。                                        |
| `policy/ingress-dm-policy-unapproved`                    | 頻道 DM 政策不在政策允許清單中。                                                  |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` 不符合政策要求的 DM 隔離範圍。                                  |
| `policy/ingress-open-groups-denied`                      | 政策拒絕開放群組輸入時，頻道群組政策為 `open`。                                   |
| `policy/ingress-group-mention-required`                  | 政策要求提及閘門時，頻道或群組項目停用了提及閘門。                                |
| `policy/gateway-non-loopback-bind`                       | 政策拒絕時，閘道繫結狀態允許非 loopback 暴露。                                   |
| `policy/gateway-auth-disabled`                           | 政策要求驗證時，閘道驗證已停用。                                                  |
| `policy/gateway-rate-limit-missing`                      | 政策要求時，閘道驗證速率限制狀態未明確設定。                                      |
| `policy/gateway-control-ui-insecure`                     | 已啟用閘道 Control UI 的不安全暴露切換。                                          |
| `policy/gateway-tailscale-funnel`                        | 政策拒絕時，仍啟用了閘道 Tailscale Funnel 暴露。                                  |
| `policy/gateway-remote-enabled`                          | 政策拒絕時，閘道遠端模式仍為作用中。                                              |
| `policy/gateway-http-endpoint-enabled`                   | 閘道 HTTP API 端點在政策拒絕時仍已啟用。                                          |
| `policy/gateway-http-url-fetch-unrestricted`             | 閘道 HTTP URL 擷取輸入缺少必要的 URL 允許清單。                                   |
| `policy/agents-workspace-access-denied`                  | 代理程式沙箱模式或工作區存取不在政策允許清單中。                                  |
| `policy/agents-tool-not-denied`                          | 代理程式或預設設定未拒絕政策要求拒絕的工具。                                      |
| `policy/tools-profile-unapproved`                        | 已設定的全域或個別代理程式工具設定檔不在允許清單中。                              |
| `policy/tools-fs-workspace-only-required`                | 檔案系統工具未設定為僅限工作區的路徑狀態。                                        |
| `policy/tools-exec-security-unapproved`                  | 執行安全模式不在政策允許清單中。                                                  |
| `policy/tools-exec-ask-unapproved`                       | 執行詢問模式不在政策允許清單中。                                                  |
| `policy/tools-exec-host-unapproved`                      | 執行主機路由不在政策允許清單中。                                                  |
| `policy/tools-elevated-enabled`                          | 政策拒絕時，已啟用提升權限工具模式。                                              |
| `policy/tools-also-allow-missing`                        | 已設定的 `alsoAllow` 清單缺少政策要求的項目。                                     |
| `policy/tools-also-allow-unexpected`                     | 已設定的 `alsoAllow` 清單包含政策未預期的項目。                                   |
| `policy/tools-required-deny-missing`                     | 全域或個別代理程式工具拒絕清單未包含必要拒絕的工具。                              |
| `policy/sandbox-mode-unapproved`                         | 沙箱模式不在政策允許清單中。                                                      |
| `policy/sandbox-backend-unapproved`                      | 沙箱後端不在政策允許清單中。                                                      |
| `policy/sandbox-container-posture-unobservable`          | 容器狀態規則已針對無法觀察該狀態的後端啟用。                                      |
| `policy/sandbox-container-host-network-denied`           | 容器支援的沙箱或瀏覽器使用主機網路模式。                                          |
| `policy/sandbox-container-namespace-join-denied`         | 容器支援的沙箱或瀏覽器加入另一個容器命名空間。                                    |
| `policy/sandbox-container-mount-mode-required`           | 容器支援的沙箱或瀏覽器掛載不是唯讀。                                              |
| `policy/sandbox-container-runtime-socket-mount`          | 容器支援的沙箱或瀏覽器掛載暴露了容器執行階段 socket。                             |
| `policy/sandbox-container-unconfined-profile`            | 政策拒絕時，容器沙箱設定檔仍為不受限制。                                          |
| `policy/sandbox-browser-cdp-source-range-missing`        | 政策要求時，沙箱瀏覽器 CDP 來源範圍缺失。                                         |
| `policy/data-handling-redaction-disabled`                | 政策要求時，敏感記錄遮蔽已停用。                                                  |
| `policy/data-handling-telemetry-content-capture`         | 政策拒絕時，仍啟用了遙測內容擷取。                                                |
| `policy/data-handling-session-retention-not-enforced`    | 政策要求時，工作階段保留維護未強制執行。                                          |
| `policy/data-handling-session-transcript-memory-enabled` | 政策拒絕時，仍啟用了工作階段逐字稿記憶索引。                                      |
| `policy/secrets-unmanaged-provider`                      | 設定 SecretRef 參照了未在 `secrets.providers` 下宣告的提供者。                    |
| `policy/secrets-denied-provider-source`                  | 設定秘密提供者或 SecretRef 使用遭政策拒絕的來源。                                 |
| `policy/secrets-insecure-provider`                       | 政策拒絕時，秘密提供者仍選擇使用不安全狀態。                                      |
| `policy/auth-profile-invalid-metadata`                   | 設定驗證設定檔缺少有效的提供者或模式中繼資料。                                    |
| `policy/auth-profile-unapproved-mode`                    | 設定驗證設定檔模式不在政策允許清單中。                                            |
| `policy/exec-approvals-missing`                          | 政策要求 `exec-approvals.json`，但缺少該成品。                                    |
| `policy/exec-approvals-invalid`                          | 無法剖析已設定的執行核准成品。                                                    |
| `policy/exec-approvals-default-security-unapproved`      | 執行核准預設值使用不在政策允許清單中的安全模式。                                  |
| `policy/exec-approvals-agent-security-unapproved`        | 個別代理程式的有效執行核准安全模式不在允許清單中。                                |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 政策拒絕時，執行核准代理程式仍隱含自動允許 skill 命令列介面。                     |
| `policy/exec-approvals-allowlist-missing`                | 核准允許清單缺少政策要求的模式。                                                  |
| `policy/exec-approvals-allowlist-unexpected`             | 核准允許清單包含政策未預期的模式。                                                |
| `policy/tools-missing-risk-level`                        | 受治理的工具宣告缺少風險中繼資料。                                                |
| `policy/tools-unknown-risk-level`                        | 受治理的工具宣告使用未知的風險值。                                                |
| `policy/tools-missing-sensitivity-token`                 | 受治理的工具宣告缺少敏感度中繼資料。                                              |
| `policy/tools-missing-owner`                             | 受治理的工具宣告缺少擁有者中繼資料。                                              |
| `policy/tools-unknown-sensitivity-token`                 | 受治理的工具宣告使用未知的敏感度值。                                              |

政策發現可以同時包含 `target` 和 `requirement`。`target` 是
觀察到的不符合項目的工作區事物。`requirement` 是導致其成為發現的已撰寫
政策規則。兩個值目前都是位址，通常是
`oc://` 路徑，但欄位名稱描述的是其政策角色，而不是
位址格式。

JSON 發現範例：

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

工具發現範例：

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

MCP 發現範例：

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

模型提供者發現範例：

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

網路發現範例：

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

範例閘道暴露發現項：

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

範例代理工作區發現項：

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

只有在明確啟用 `workspaceRepairs` 時，`doctor --fix` 才會編輯由政策管理的工作區設定。若未選擇啟用，政策檢查會回報它們將修復的內容，並讓設定保持不變。

在此版本中，修復可以停用 OpenClaw 設定中已啟用、但遭 `channels.denyRules` 拒絕的頻道。請只在政策檔案已審查後才啟用 `workspaceRepairs`，因為有效的拒絕規則可能會關閉已設定的頻道：

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

| 命令             | `0`                                      | `1`                                            | `2`                |
| ---------------- | ---------------------------------------- | ---------------------------------------------- | ------------------ |
| `policy check`   | 閾值內沒有發現項。                       | 一個或多個發現項符合閾值。                     | 引數或執行階段失敗。 |
| `policy compare` | 政策檔案至少與基準同樣嚴格。             | 政策檔案無效、遺失，或比基準規則寬鬆。         | 引數或執行階段失敗。 |
| `policy watch`   | 沒有發現項，且已接受的雜湊為最新。       | 存在發現項，或已接受的證明已過期。             | 引數或執行階段失敗。 |

## 相關

- [Doctor lint 模式](/zh-TW/cli/doctor#lint-mode)
- [Path 命令列介面](/zh-TW/cli/path)
